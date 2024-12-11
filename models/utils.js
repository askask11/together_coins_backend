// Johnson Gao 11/27/2024
// Description: This file contains the utility functions for the application.
//  By using this file, we can avoid code duplication and make the code more modular.
//  The generateRandomString function generates a random string of a given length.
//  The function is used in the upload route to generate a random filename for the uploaded file.
//  The ResponseJson class is used to generate JSON responses for the API endpoints.
//  The class has static methods to generate different types of responses, such as success, error, no login, and SQL error.
//  By using this class, we can maintain a consistent response format across all API endpoints.

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

module.exports = { generateRandomString };