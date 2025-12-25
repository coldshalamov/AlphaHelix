// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {AlphaHelixParameters} from "./AlphaHelixParameters.sol";
import {MarketFactory} from "./MarketFactory.sol";
import {TruthMarket} from "./TruthMarket.sol";
import {ITruthMarket} from "./interfaces/ITruthMarket.sol";
import {IAlphaHelixRegistry} from "./interfaces/IAlphaHelixRegistry.sol";

/**
 * @title AlphaHelixRegistry
 * @notice Coordinates claim creation, market lifecycle, and resolution reporting for Alpha-Helix.
 */
contract AlphaHelixRegistry is
    AccessControl,
    ReentrancyGuard,
    IAlphaHelixRegistry
{
    using SafeERC20 for IERC20;

    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    struct ClaimMeta {
        bytes32 claimHash;
        string statement;
        string metadataURI;
        address creator;
        uint256 creationBond;
        uint256 activeVersion;
        uint256 totalVersions;
        bool exists;
    }

    struct VersionInfo {
        address market;
        address challenger;
        uint64 openedAt;
        uint64 resolvedAt;
        ITruthMarket.Resolution outcome;
        uint256 confidenceBps;
        uint256 totalValueLocked;
        uint256 trueStake;
        uint256 falseStake;
        uint256 unalignedStake;
        uint256 protocolFee;
        string evidenceURI;
    }

    IERC20 public immutable hlx;
    AlphaHelixParameters public immutable parametersContract;
    MarketFactory public factory;
    address public treasury;

    uint256 public nextClaimId = 1;

    mapping(uint256 => ClaimMeta) public claims;
    mapping(bytes32 => uint256) public claimIdByHash;
    mapping(uint256 => mapping(uint256 => VersionInfo)) public versions;
    mapping(address => uint256) public marketToClaimId;
    mapping(address => uint256) public marketToVersion;

    event TreasuryUpdated(address treasury);
    event FactoryUpdated(address factory);

    event ClaimRegistered(
        uint256 indexed claimId,
        uint256 indexed version,
        address indexed market,
        bytes32 claimHash,
        address creator,
        string statement,
        string metadataURI,
        string evidenceURI,
        uint64 tradingClosesAt
    );

    event ClaimOutcome(
        uint256 indexed claimId,
        uint256 indexed version,
        ITruthMarket.Resolution outcome,
        uint256 confidenceBps,
        uint256 totalValueLocked,
        uint256 trueStake,
        uint256 falseStake,
        uint256 unalignedStake,
        uint256 protocolFee
    );

    event ClaimReopened(
        uint256 indexed claimId,
        uint256 indexed version,
        address indexed challenger,
        uint256 challengeBond,
        uint64 tradingClosesAt,
        string evidenceURI
    );

    constructor(
        address governor,
        IERC20 hlxToken,
        AlphaHelixParameters parameters_,
        MarketFactory factory_,
        address treasury_
    ) {
        require(governor != address(0), "Governor required");
        require(address(hlxToken) != address(0), "Token required");
        require(address(parameters_) != address(0), "Params required");
        require(address(factory_) != address(0), "Factory required");
        require(treasury_ != address(0), "Treasury required");

        hlx = hlxToken;
        parametersContract = parameters_;
        factory = factory_;
        treasury = treasury_;

        _grantRole(DEFAULT_ADMIN_ROLE, governor);
        _grantRole(GOVERNOR_ROLE, governor);
    }

    // -------- Governance setters --------

    function setTreasury(address newTreasury) external onlyRole(GOVERNOR_ROLE) {
        require(newTreasury != address(0), "Zero treasury");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    function setFactory(address newFactory) external onlyRole(GOVERNOR_ROLE) {
        require(newFactory != address(0), "Zero factory");
        factory = MarketFactory(newFactory);
        emit FactoryUpdated(newFactory);
    }

    function parameters() external view override returns (address) {
        return address(parametersContract);
    }

    // -------- Claim lifecycle --------

    function createClaim(
        string calldata statement,
        string calldata metadataURI,
        string calldata evidenceURI,
        uint64 tradingClosesAt
    )
        external
        nonReentrant
        returns (uint256 claimId, uint256 version, address market)
    {
        AlphaHelixParameters.Config memory cfg = parametersContract
            .getConfig();
        require(
            tradingClosesAt >= block.timestamp + cfg.minimumTradingSeconds,
            "Trading window too short"
        );

        bytes32 claimHash = keccak256(bytes(statement));
        require(claimIdByHash[claimHash] == 0, "Claim already exists");

        claimId = nextClaimId++;
        version = 1;

        ClaimMeta storage meta = claims[claimId];
        meta.claimHash = claimHash;
        meta.statement = statement;
        meta.metadataURI = metadataURI;
        meta.creator = msg.sender;
        meta.creationBond = cfg.creationBond;
        meta.totalVersions = 1;
        meta.activeVersion = 1;
        meta.exists = true;

        if (cfg.creationBond > 0) {
            hlx.safeTransferFrom(
                msg.sender,
                address(this),
                cfg.creationBond
            );
        }

        claimIdByHash[claimHash] = claimId;

        market = factory.deployMarket(address(this));

        TruthMarket.SeedConfig memory seed = TruthMarket.SeedConfig({
            seeder: address(0),
            trueStake: 0,
            falseStake: 0,
            unalignedStake: 0,
            lockSeeder: false
        });

        TruthMarket(market).initialize(
            address(this),
            address(hlx),
            treasury,
            claimId,
            version,
            tradingClosesAt,
            cfg.resolutionDelaySeconds,
            cfg.appealWindowSeconds,
            cfg.minStake,
            cfg.feeBps,
            seed
        );

        marketToClaimId[market] = claimId;
        marketToVersion[market] = version;

        VersionInfo storage info = versions[claimId][version];
        info.market = market;
        info.openedAt = uint64(block.timestamp);
        info.evidenceURI = evidenceURI;
        info.outcome = ITruthMarket.Resolution.Pending;

        emit ClaimRegistered(
            claimId,
            version,
            market,
            claimHash,
            msg.sender,
            statement,
            metadataURI,
            evidenceURI,
            tradingClosesAt
        );

        return (claimId, version, market);
    }

    function reopenClaim(
        uint256 claimId,
        string calldata evidenceURI,
        uint64 tradingClosesAt
    )
        external
        nonReentrant
        returns (uint256 version, address market)
    {
        ClaimMeta storage meta = claims[claimId];
        require(meta.exists, "No claim");
        require(meta.activeVersion == 0, "Active market");

        AlphaHelixParameters.Config memory cfg = parametersContract
            .getConfig();
        require(
            tradingClosesAt >= block.timestamp + cfg.minimumTradingSeconds,
            "Trading window too short"
        );

        uint256 lastVersion = meta.totalVersions;
        VersionInfo storage lastInfo = versions[claimId][lastVersion];
        require(
            lastInfo.outcome != ITruthMarket.Resolution.Pending,
            "Previous unresolved"
        );

        uint256 requiredBond = Math.max(
            cfg.creationBond,
            (lastInfo.totalValueLocked * cfg.challengeBondBps) / 10_000
        );

        hlx.safeTransferFrom(msg.sender, address(this), requiredBond);

        market = factory.deployMarket(address(this));

        uint256 seedTrue = requiredBond / 2;
        uint256 seedFalse = requiredBond - seedTrue;

        hlx.safeTransfer(market, requiredBond);

        TruthMarket.SeedConfig memory seed = TruthMarket.SeedConfig({
            seeder: msg.sender,
            trueStake: seedTrue,
            falseStake: seedFalse,
            unalignedStake: 0,
            lockSeeder: true
        });

        version = meta.totalVersions + 1;

        TruthMarket(market).initialize(
            address(this),
            address(hlx),
            treasury,
            claimId,
            version,
            tradingClosesAt,
            cfg.resolutionDelaySeconds,
            cfg.appealWindowSeconds,
            cfg.minStake,
            cfg.feeBps,
            seed
        );

        meta.totalVersions = version;
        meta.activeVersion = version;

        marketToClaimId[market] = claimId;
        marketToVersion[market] = version;

        VersionInfo storage info = versions[claimId][version];
        info.market = market;
        info.challenger = msg.sender;
        info.openedAt = uint64(block.timestamp);
        info.evidenceURI = evidenceURI;
        info.outcome = ITruthMarket.Resolution.Pending;

        emit ClaimReopened(
            claimId,
            version,
            msg.sender,
            requiredBond,
            tradingClosesAt,
            evidenceURI
        );

        return (version, market);
    }

    // -------- Market callback --------

    function onMarketResolved(
        ResolutionReport calldata report
    ) external override nonReentrant {
        uint256 claimId = marketToClaimId[msg.sender];
        require(claimId != 0, "Unknown market");
        uint256 version = marketToVersion[msg.sender];
        require(version == report.version, "Version mismatch");
        require(
            report.claimId == claimId,
            "Claim mismatch"
        );

        ClaimMeta storage meta = claims[claimId];
        VersionInfo storage info = versions[claimId][version];

        require(info.outcome == ITruthMarket.Resolution.Pending, "Already set");

        info.outcome = report.outcome;
        info.resolvedAt = uint64(block.timestamp);
        info.confidenceBps = report.confidenceBps;
        info.totalValueLocked = report.totalValueLocked;
        info.trueStake = report.trueStake;
        info.falseStake = report.falseStake;
        info.unalignedStake = report.unalignedStake;
        info.protocolFee = report.protocolFee;

        meta.activeVersion = 0;

        emit ClaimOutcome(
            claimId,
            version,
            report.outcome,
            report.confidenceBps,
            report.totalValueLocked,
            report.trueStake,
            report.falseStake,
            report.unalignedStake,
            report.protocolFee
        );

        // Handle creator bond release once the first market resolves.
        if (version == 1 && meta.creationBond > 0) {
            AlphaHelixParameters.Config memory cfg = parametersContract
                .getConfig();
            uint256 engagement = report.trueStake + report.falseStake;
            address recipient = engagement >= cfg.minimumEngagement
                ? meta.creator
                : treasury;
            hlx.safeTransfer(recipient, meta.creationBond);
            meta.creationBond = 0;
        }
    }
}
