const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =
  `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.n1li6q4.mongodb.net/?appName=Cluster0`;
const port = process.env.PORT || 3000;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("movieMaster");
    const moviesCollection = db.collection("movies");
// load all movies 
    app.get("/movies", async(req, res) => {
      const result = await moviesCollection.find().toArray();
      res.send(result);
    });


    // load id specific movie
     
    app.get('/movies/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await moviesCollection.findOne(query);
      res.send(result);
      
    });
  } finally {
    // Ensures that the client will close when you finish/error
  }
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

run().catch(console.dir);
