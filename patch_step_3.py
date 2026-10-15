with open("contracts/HelixMarket.sol", "r") as f:
    content = f.read()

old_preview = "isCommitPhaseOpen = s.randomCloseEnabled ? (s.commitPhaseClosed == 0) : (block.timestamp < s.commitEndTime);"
new_preview = "isCommitPhaseOpen = s.randomCloseEnabled ? (s.commitPhaseClosed == 0 && block.timestamp < s.hardCommitEndTime) : (block.timestamp < s.commitEndTime);"
content = content.replace(old_preview, new_preview)

with open("contracts/HelixMarket.sol", "w") as f:
    f.write(content)
