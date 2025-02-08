const fs = require('fs');

// Path to the JSON file
const filePath = 'src\nft_assets.json';

// Read the JSON file



export const updateData = () =>{
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }

        console.log(data)
    
        // try {
        //     // Parse the JSON data
        //     let jsonData = JSON.parse(data);
    
        //     // Update a key-value pair (modify as needed)
        //     jsonData.updatedAt = new Date().toISOString();
    
        //     // Write the updated JSON back to the file
        //     fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
        //         if (err) {
        //             console.error('Error writing file:', err);
        //             return;
        //         }
        //         console.log('JSON file updated successfully.');
        //     });
    
        // } catch (parseError) {
        //     console.error('Error parsing JSON:', parseError);
        // }
    });
}

