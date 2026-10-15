with open("contracts/HelixMarket.sol", "r") as f:
    content = f.read()

old_commit = "bool commitPhaseOpen = s.randomCloseEnabled ? (s.commitPhaseClosed == 0) : (block.timestamp < s.commitEndTime);"
new_commit = "bool commitPhaseOpen = s.randomCloseEnabled ? (s.commitPhaseClosed == 0 && block.timestamp < s.hardCommitEndTime) : (block.timestamp < s.commitEndTime);"
content = content.replace(old_commit, new_commit)

with open("contracts/HelixMarket.sol", "w") as f:
    f.write(content)
