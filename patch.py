with open("contracts/HelixMarket.sol", "r") as f:
    content = f.read()

# Fix commitBet
old_commit = "bool commitPhaseOpen = s.randomCloseEnabled ? (s.commitPhaseClosed == 0) : (block.timestamp < s.commitEndTime);"
new_commit = "bool commitPhaseOpen = s.randomCloseEnabled ? (s.commitPhaseClosed == 0 && block.timestamp < s.hardCommitEndTime) : (block.timestamp < s.commitEndTime);"
content = content.replace(old_commit, new_commit)

# Fix revealBet
old_reveal = "bool commitPhaseClosedBeforeCheck = s.randomCloseEnabled ? (s.commitPhaseClosed > 0) : (block.timestamp >= s.commitEndTime);"
new_reveal = "bool commitPhaseClosedBeforeCheck = s.randomCloseEnabled ? (s.commitPhaseClosed > 0 || block.timestamp >= s.hardCommitEndTime) : (block.timestamp >= s.commitEndTime);"
content = content.replace(old_reveal, new_reveal)

# Fix previewCloseCheck
old_preview = "isCommitPhaseOpen = s.randomCloseEnabled ? (s.commitPhaseClosed == 0) : (block.timestamp < s.commitEndTime);"
new_preview = "isCommitPhaseOpen = s.randomCloseEnabled ? (s.commitPhaseClosed == 0 && block.timestamp < s.hardCommitEndTime) : (block.timestamp < s.commitEndTime);"
content = content.replace(old_preview, new_preview)

with open("contracts/HelixMarket.sol", "w") as f:
    f.write(content)
