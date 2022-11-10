
const express = require('express')
const jwt = require('jsonwebtoken');
require('dotenv').config()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json())


// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xjyy1gb.mongodb.net/?retryWrites=true&w=majority`;
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const uri = "mongodb+srv://neveen:2QxRUIG8rmpkA0Yl@cluster0.hfpwfwa.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers?.authorization;
    console.log(authHeader);
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Access Forbidden' });
        }
        req.decoded = decoded;
        next();
    });
}

app.get('/', (req, res) => {
    res.send('service provider server Running')
})

app.get('/jwt', (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN);
    res.send({ token });
})

const run = async () => {

    try {
        const database = client.db('serviceDB');
        const servicesCollection = database.collection('services');
        const reviewsCollection = database.collection('reviews');

        // SERVICES API COLLECTIONS 
        app.get('/services', async (req, res) => {
            const { email, limit } = req.query;
            if (!email) {
                const allServices = (await (servicesCollection.find({})).toArray()).reverse();
                if (!limit) {
                    res.send(allServices);
                } else {
                    const services = allServices.slice(0, parseInt(limit));
                    res.send(services);
                }
            } else {
                const query = { email: email }
                const services = await (servicesCollection.find(query)).toArray();
                res.send(services);
            }
        })

        app.get('/services/:id', async (req, res) => {
            const { id } = req.params;
            console.log(id)
            const service = await servicesCollection.findOne({ _id: ObjectId(id) });
            res.send(service)
        })

        app.post('/services', async (req, res) => {
            const service = req.body;
            console.log(service);
            const result = await servicesCollection.insertOne(service);
            res.send(result)
        })

        app.patch('/services/:id', async (req, res) => {
            const { id } = req.params;
            const service = req.body;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    title: service.title,
                    image: service.image,
                    description: service.description,
                },
            };
            const result = await servicesCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })

        app.delete('/services/:id', async (req, res) => {
            const { id } = req.params;
            console.log(id);
            const result = await servicesCollection.deleteOne({ _id: ObjectId(id) })
            res.send(result)

        })


        // Reviews API Collections
        app.get('/reviews', async (req, res) => {
            const allReviews = (await (reviewsCollection.find({})).toArray()).reverse();
            res.send(allReviews);
        })


        // app.get('/reviews/:email', verifyJWT, async (req, res) => {
        //     const decoded = req.decoded?.email;
        //     const { email } = req.params;
        //     if (decoded !== email) {
        //         return res.status(403).send({ message: "Forbidded Access.." })
        //     }
        //     const query = { email: email }
        //     const reviews = await reviewsCollection.find(query).toArray();
        //     res.send(reviews);
        // })

        app.get('/myreviews/:email', async (req, res) => {
            const { email } = req.params;
            console.log(email)
            const result = await reviewsCollection.find({ email: email }).toArray();

            console.log(result);
            res.send(result)
        })
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            console.log(review);
            const result = await reviewsCollection.insertOne(review);
            res.send(result)
        })
        app.get('/reviews/service/:service_id', async (req, res) => {
            const { service_id } = req.params;

            const result = (await reviewsCollection.find({ service_id: service_id }).toArray()).reverse();
            res.send(result)
        })

        app.patch('/reviews/:id', async (req, res) => {
            const { id } = req.params;
            const review = req.body;

            console.log(id, review)
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    description: review.description
                },
            };
            const result = await reviewsCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })

        app.delete('/reviews/:id', async (req, res) => {
            const { id } = req.params;
            const query = { _id: ObjectId(id) }
            const result = await reviewsCollection.deleteOne(query);
            res.send(result)
        })

    } finally {

    }

}
run().catch(err => console.dir(err))


app.listen(port, () => {
    console.log(`Server Running on port ${port}`)
})





