with open("contracts/HelixMarket.sol", "r") as f:
    content = f.read()

old_reveal = "bool commitPhaseClosedBeforeCheck = s.randomCloseEnabled ? (s.commitPhaseClosed > 0) : (block.timestamp >= s.commitEndTime);"
new_reveal = "bool commitPhaseClosedBeforeCheck = s.randomCloseEnabled ? (s.commitPhaseClosed > 0 || block.timestamp >= s.hardCommitEndTime) : (block.timestamp >= s.commitEndTime);"
content = content.replace(old_reveal, new_reveal)

with open("contracts/HelixMarket.sol", "w") as f:
    f.write(content)
