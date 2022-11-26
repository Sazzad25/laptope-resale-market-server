const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
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

        app.get('/category', async(req, res) => {
            const query = {};
            const options = await categoryCollection.find(query).toArray();
            res.send(options);
        })
    }
    finally{

    }
}
run().catch(console.log);



app.get('/', async(req, res) =>{
    res.send("laptop resale server is running")
})

app.listen(port, () => console.log(`Laptop resale portal running ${port}`))
