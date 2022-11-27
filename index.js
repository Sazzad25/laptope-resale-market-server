const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
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
        })

        app.post('/bookings', async(req, res) =>{
            const booking = req.body
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        });

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

        app.post('/buyers', async(req, res) =>{
            const user = req.body;
            const result = await buyersCollection.insertOne(user);
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
