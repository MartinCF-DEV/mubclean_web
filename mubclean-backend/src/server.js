require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const mercadopago = require('mercadopago');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Frontend URL for callbacks
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

// MercadoPago Setup
const client = new mercadopago.MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const preference = new mercadopago.Preference(client);

// Routes
app.get('/', (req, res) => {
    res.send('Mubclean Backend is running!');
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.post('/api/create_preference', async (req, res) => {
    try {
        const { items, solicitudId } = req.body;

        // Validate input
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Invalid items format' });
        }

        // Map items to MercadoPago format
        const mpItems = items.map(item => ({
            title: item.title,
            description: item.description,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            currency_id: item.currency_id || 'MXN',
        }));

        const body = {
            items: mpItems,
            external_reference: solicitudId,
            back_urls: {
                success: `${frontendUrl}/customer/payment/success`,
                failure: `${frontendUrl}/customer/payment/failure`,
                pending: `${frontendUrl}/customer/payment/pending`,
            },
            auto_return: 'approved',
        };

        const result = await preference.create({ body });

        res.json({ init_point: result.init_point });
    } catch (error) {
        console.error('Error creating preference:', error);
        res.status(500).json({ error: 'Failed to create preference' });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
