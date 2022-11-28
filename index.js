const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mwoallb.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'forbidden access'})
        }
        req.decoded = decoded;
        next();
    })
}
async function run(){
    try{
        const categoryCollection = client.db('LaptopResale').collection('category');
        const productCollection = client.db('LaptopResale').collection('product');

        const bookingCollection = client.db('LaptopResale').collection('bookings');
        const buyersCollection = client.db('LaptopResale').collection('buyers');
        const addproductCollection = client.db('LaptopResale').collection('addproduct');
        const paymentsCollection = client.db('LaptopResale').collection('payments');

        const verifyAdmin = async (req, res, next) =>{
            const decodedEmail = req.decoded.email;
            const query = {email: decodedEmail};
            const user = await buyersCollection.findOne(query);

            if(user?.role !== 'admin'){
                return res.status(403).send({message: 'forbidden access'})
            }
            next();
        }



        app.get('/category', async(req, res) => {
            const query = {};
            const options = await categoryCollection.find(query).toArray();
            res.send(options);
        });

        app.get('/product', async(req, res) => {
            const query = {};
            const option = await productCollection.find(query).toArray();
            res.send(option);
        });

        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;

            const decodeEmail = req.decoded.email;

            if(email !== decodeEmail){
                return res.status(403).send({message: 'forbidden access'});
            }

            const query = {email: email};
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        });

        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id) };
            const booking = await bookingCollection.findOne(query);
            res.send(booking);
        })

        app.post('/bookings', async(req, res) =>{
            const booking = req.body
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        });

        app.post('/create-payment-intent', async (req, res) =>{
            const booking = req.body;
            const resale_price = booking.price;
            const amount = resale_price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
              });
        });

        app.post('/payments', async (req, res) =>{
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = {_id: ObjectId(id)}
            const updateDoc = {
                $set: {
                    paid: true,
                    transaction: payment.transactionId
                }
            }
            const updatedResult = await bookingCollection.updateOne(filter, updateDoc)
            res.send(updatedResult);
        })

        app.get('/jwt', async (req, res) =>{
            const email = req.query.email;
            const query = { email: email };
            const user = await buyersCollection.findOne(query);
            if(user){
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {expiresIn: '1hr'})
                return res.send({accessToken: token});
            }
            res.status(403).send({accessToken: ''})
        });

        app.get('/buyers', async(req, res) =>{
            const query = {};
            const users = await buyersCollection.find(query).toArray();
            res.send(users);
        })

        app.get('/buyers/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = {email}
            const user = await buyersCollection.findOne(query);
            res.send({isAdmin: user?.role === 'admin'});
        })

        app.post('/buyers', async(req, res) =>{
            const user = req.body;
            const result = await buyersCollection.insertOne(user);
            res.send(result);
        });

        app.put('/buyers/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
           

            const id = req.params.id;
            const filter = {_id: ObjectId(id)}
            const options = { upsert: true};
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await buyersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        app.get('/addproduct', verifyJWT, verifyAdmin, async(req, res) =>{
            const query = {};
            const result = await addproductCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/addproduct', verifyJWT, verifyAdmin, async(req, res) =>{
            const addproducts = req.body;
            const result = await addproductCollection.insertOne(addproducts);
            res.send(result);
        });

        app.delete('/addproduct/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const result = await addproductCollection.deleteOne(filter);
            res.send(result);
        })


        // app.get('/product/:id', async(req, res) => {
        //     const id = req.params.id;
        //     const query = (category_id == id);
        //     const products = await productCollection.filter(query);
        //     res.send(products);
        // })

        // app.get('/category/:id',async (req, res) => {
        //     const id = req.params.category_id;
        //     // const query = {};
        //     // const services = productCollection.find(query);
        //     // const laptops = await services.toArray();
           
            
        //       const products = await productCollection.filter(n => n.category_id === id);
        //       res.send(products);
            
            
        //   })

    }
    finally{

    }
}
run().catch(console.log);



app.get('/', async(req, res) =>{
    res.send("laptop resale server is running")
})

app.listen(port, () => console.log(`Laptop resale portal running ${port}`))
