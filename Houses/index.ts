const express = require('express');
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const path = require("path");
const multer = require("multer");
const fs = require("fs"); // Importe o módulo "fs" para lidar com o sistema de arquivos
const app = express();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/pages');
app.use(bodyParser.urlencoded({ extended: true }));

const uri = "mongodb://127.0.0.1:27017/house";

async function connectToDatabase() {
  const client = new MongoClient(uri, { useUnifiedTopology: true });

  try {
    await client.connect();
    return client.db();
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error);
    throw error;
  }
}

// Certificar-se de que o diretório "uploads" exista
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Salva o arquivo no diretório "uploads"
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Define o nome do arquivo
  },
});

const upload = multer({ storage: storage });

app.get('', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const housesCollection = db.collection("houses");

    const dev = await housesCollection.find().toArray();

    res.render("main.ejs", { dev });
  } catch (error) {
    console.error("Erro ao buscar pessoas:", error);
    res.status(500).send("Erro ao buscar pessoas.");
  }
});

app.post("/addDev", upload.single("image"), async (req, res) => {
  const { name, description } = req.body;
  const image = req.file.filename;

  try {
    const db = await connectToDatabase();
    const housesCollection = db.collection("houses");

    const dev = { name, description, image };

    await housesCollection.insertOne(dev);

    console.log("Pessoa inserida no MongoDB:", dev);

    res.redirect("/");
  } catch (error) {
    console.error("Erro ao inserir pessoa:", error);
    res.status(500).send("Erro ao inserir pessoa.");
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000, () => {
  console.log(`Server is running`);
});
