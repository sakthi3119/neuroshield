const fs = require('fs').promises;
const path = require('path');
const aiAgent = require('./aiAgent');

async function runTest() {
    const testDir = 'C:/SensitiveDocs';
    const testFiles = [
        'confidential_report.txt',
        'password_list.txt',
        'public_document.txt'
    ];

    try {
        // Create test directory if it doesn't exist
        await fs.mkdir(testDir, { recursive: true });

        // Create test files
        for (const file of testFiles) {
            const filePath = path.join(testDir, file);
            await fs.writeFile(filePath, `Test content for ${file}`);
            console.log(`Created test file: ${filePath}`);

            // Simulate file operation
            const result = await aiAgent.evaluateFileOperation(file, filePath, 'copy');
            console.log('\nOperation Result:', {
                fileName: file,
                sensitivity: result.sensitivity,
                shouldAlert: result.shouldAlert,
                operationCount: result.operationCount
            });
        }

        console.log('\nTest completed! Please check:');
        console.log('1. MongoDB Compass - database: neuroshield, collection: fileactivities');
        console.log('2. Your email inbox for alerts');
        console.log(`3. Test files in ${testDir}`);

    } catch (error) {
        console.error('Test error:', error);
    }
}

runTest(); 