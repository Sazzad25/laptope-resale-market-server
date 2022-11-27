const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mwoallb.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const categoryCollection = client.db('LaptopResale').collection('category');
        const productCollection = client.db('LaptopResale').collection('product');

        const bookingCollection = client.db('LaptopResale').collection('bookings');

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

        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        })

        app.post('/bookings', async(req, res) =>{
            const booking = req.body
            const result = await bookingCollection.insertOne(booking);
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
