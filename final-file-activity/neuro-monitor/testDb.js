const aiAgent = require('./aiAgent');
const path = require('path');

async function testDatabase() {
    console.log('Starting database test...');
    
    try {
        // Test file operations
        const testFiles = [
            'confidential_document.txt',
            'public_info.txt',
            'password_list.txt'
        ];

        for (const file of testFiles) {
            console.log(`\nTesting with file: ${file}`);
            
            const result = await aiAgent.evaluateFileOperation(
                file,
                path.join('C:/SensitiveDocs', file),
                'copy'
            );

            console.log('Operation result:', result);
        }

        console.log('\nDatabase test completed!');
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testDatabase(); 