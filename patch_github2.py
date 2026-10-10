import re

with open('.github/workflows/ci-cd.yml', 'r') as f:
    content = f.read()

content = content.replace("node-version: '20.x'", "node-version: '20'")

with open('.github/workflows/ci-cd.yml', 'w') as f:
    f.write(content)
