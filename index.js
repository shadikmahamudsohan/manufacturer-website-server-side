const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yhsz7.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();
        const productCollection = client.db('toolsNestBD').collection('products');
        const userCollection = client.db('toolsNestBD').collection('user');
        const reviewCollection = client.db('toolsNestBD').collection('review');

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ result, token });
        });

        app.get('/get-user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const products = await userCollection.findOne(query);
            res.send(products);
        });
        app.get('/all-user', verifyJWT, async (req, res) => {
            const user = await userCollection.find({}).toArray();
            res.send(user);
        });
        app.put('/add-admin/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = { $set: { admin: true } };
            const option = { upsert: true };
            const result = await userCollection.updateOne(filter, updateDoc, option);
            res.send(result);
        });
        app.put('/remove-admin/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = { $set: { admin: false } };
            const option = { upsert: true };
            const result = await userCollection.updateOne(filter, updateDoc, option);
            res.send(result);
        });

        app.put('/update-user/:email', async (req, res) => {
            const email = req.params.email;
            const data = req.body;
            const filter = { email: email };
            const updateDoc = { $set: data };
            const option = { upsert: true };
            const result = await userCollection.updateOne(filter, updateDoc, option);
            res.send(result);
        });

        app.get('/get-product', async (req, res) => {
            const products = await productCollection.find({}).toArray();
            res.send(products);
        });
        app.post('/add-product', async (req, res) => {
            const data = req.body;
            const result = await productCollection.insertOne(data);
            res.send(result);
        });
        app.put('/update-product/:id', async (req, res) => {
            const { id } = req.params;
            const data = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = { $set: data };
            const option = { upsert: true };
            const result = await productCollection.updateOne(filter, updateDoc, option);
            res.send(result);
        });

        app.get('/get-review', async (req, res) => {
            const review = await reviewCollection.find({}).toArray();
            res.send(review);
        });
        app.post('/add-review', async (req, res) => {
            const data = req.body;
            const result = await reviewCollection.insertOne(data);
            res.send(result);
        });
    } finally {
    }
}
run().catch(console.dir);

app.get('/', async (req, res) => {
    res.send('tools Nest BD is running!');
});

app.listen(port, () => {
    console.log(`app listening on port ${port}`);
});