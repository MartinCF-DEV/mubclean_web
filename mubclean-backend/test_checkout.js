const https = require('https');

const data = JSON.stringify({
    title: 'Test',
    price: 1500,
    planType: 'annual'
});

const options = {
    hostname: 'mubclean-backend.onrender.com',
    port: 443,
    path: '/api/create_guest_license_preference',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (d) => { body += d; });
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', body);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
