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

// Create License Preference (For Business Registration)
app.post('/api/create_license_preference', async (req, res) => {
    try {
        const { businessId, title, price, payerEmail, planType } = req.body;

        if (!businessId || !price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const body = {
            items: [
                {
                    title: title || 'Licencia Anual Mubclean',
                    quantity: 1,
                    unit_price: Number(price),
                    currency_id: 'MXN',
                    description: `Licencia ${planType} para operar como negocio en Mubclean`,
                }
            ],
            payer: {
                email: payerEmail
            },
            external_reference: JSON.stringify({ businessId, planType }), // Store planType in metadata
            back_urls: {
                success: `${frontendUrl}/admin/payment/success`,
                failure: `${frontendUrl}/admin/payment/failure`,
                pending: `${frontendUrl}/admin/payment/pending`,
            },
            auto_return: 'approved',
        };

        const result = await preference.create({ body });
        res.json({ init_point: result.init_point });
    } catch (error) {
        console.error('Error creating license preference:', error);
        res.status(500).json({ error: 'Failed to create preference' });
    }
});

// Confirm License Payment (Optional/verification webhook alternative)
app.post('/api/confirm_license_payment', async (req, res) => {
    try {
        const { paymentId, businessId } = req.body; // legacy support if frontend sends raw businessId
        //Ideally we should parse it from external_reference if possible, but frontend might just send what it has.
        // Actually, let's rely on the frontend passing the planType OR we default. 
        // BUT wait, in the plan I said I'd update confirm logic.
        // If `businessId` passed here is just the ID, we don't know the plan type unless we stored it or frontend tells us.
        // Let's check `admin-payment-callback` - it gets `external_reference` from URL.
        // In `create_license_preference` above I put JSON in external_reference.
        // So frontend `external_reference` param will be a JSON string?
        // MercadoPago `external_reference` field is usually a string.

        // Let's keep it simple: The frontend will receive the `external_reference` which IS the JSON string I set above.
        // The frontend parses it? Or sends it raw? 
        // `admin-payment-callback.ts` sends `businessId: externalReference`. 
        // So if I change externalReference to JSON, `businessId` in `confirm_license_payment` will be that JSON string.

        let actualBusinessId = businessId;
        let planType = 'annual'; // default

        try {
            const parsed = JSON.parse(businessId);
            if (parsed.businessId) {
                actualBusinessId = parsed.businessId;
                planType = parsed.planType || 'annual';
            }
        } catch (e) {
            // Not JSON, assume it's just the ID (legacy/simple)
            console.log('External reference is not JSON, usind as ID:', businessId);
        }

        let expiryDate = new Date();
        if (planType === 'trial') {
            expiryDate.setDate(expiryDate.getDate() + 30); // 30 days trial (paid)
        } else if (planType === 'monthly') {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
        } else {
            // annual
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        }

        // Update database
        const { error } = await supabase
            .from('negocios')
            .update({
                subscription_status: 'active',
                payment_id: paymentId,
                license_expiry: expiryDate
            })
            .eq('id', actualBusinessId);

        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ error: 'Failed to confirm payment' });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
