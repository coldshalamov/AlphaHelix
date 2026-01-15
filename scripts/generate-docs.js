#!/usr/bin/env node

/**
 * Generate NatSpec Documentation
 * 
 * This script generates comprehensive documentation from contract NatSpec comments
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONTRACTS_DIR = path.join(__dirname, '..', 'contracts');
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'api');

// Ensure docs directory exists
if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
}

console.log('📚 Generating NatSpec documentation...\n');

// Generate documentation using hardhat
try {
    console.log('Running hardhat docgen...');
    execSync('npx hardhat docgen', { stdio: 'inherit' });
    console.log('✅ Documentation generated successfully!\n');
} catch (error) {
    console.log('⚠️  Hardhat docgen not available, using manual extraction...\n');

    // Manual extraction fallback
    const contracts = fs.readdirSync(CONTRACTS_DIR)
        .filter(file => file.endsWith('.sol') && !file.startsWith('.'));

    for (const contract of contracts) {
        const contractPath = path.join(CONTRACTS_DIR, contract);
        const content = fs.readFileSync(contractPath, 'utf8');

        // Extract NatSpec comments
        const natspecRegex = /\/\*\*[\s\S]*?\*\//g;
        const natspecComments = content.match(natspecRegex) || [];

        if (natspecComments.length > 0) {
            const docPath = path.join(DOCS_DIR, `${contract.replace('.sol', '.md')}`);
            let markdown = `# ${contract.replace('.sol', '')}\n\n`;
            markdown += `## Contract Documentation\n\n`;
            markdown += `Source: \`contracts/${contract}\`\n\n`;

            natspecComments.forEach(comment => {
                // Convert NatSpec to markdown
                const cleaned = comment
                    .replace(/\/\*\*|\*\//g, '')
                    .split('\n')
                    .map(line => line.replace(/^\s*\*\s?/, ''))
                    .filter(line => line.trim())
                    .join('\n');

                markdown += cleaned + '\n\n';
            });

            fs.writeFileSync(docPath, markdown);
            console.log(`✅ Generated docs for ${contract}`);
        }
    }
}

console.log('\n📖 Documentation available in docs/api/');
console.log('✨ Done!\n');
