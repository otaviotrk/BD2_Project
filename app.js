const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const readline = require('readline');

const app = express();
const port = 3333;

const url = 'mongodb://localhost:27017';
const dbName = 'LocadoraDeFilmes';

app.use(bodyParser.json());

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createItem() {
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();

  const db = client.db(dbName);
  const collection = db.collection('items');

  const nome = await askQuestion('Digite o nome do filme: ');
  const descricao = await askQuestion('Digite a descrição do filme: ');
  const genero = await askQuestion('Digite o gênero do filme: ');
  const anoLancamento = parseInt(await askQuestion('Digite o ano de lançamento do filme: '));

  const newItem = { nome, descricao, genero, anoLancamento };
  const result = await collection.insertOne(newItem);

  client.close();

  console.log('Resultado da criação do filme:', result);
}

async function updateItem() {
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();

  const db = client.db(dbName);
  const collection = db.collection('items');

  const itemId = await askQuestion('Digite o ID do filme que deseja atualizar: ');

  const existingItem = await collection.findOne({ _id: new ObjectId(itemId) });

  if (!existingItem) {
    console.log('Filme não encontrado.');
    return;
  }

  console.log('Detalhes do filme atual:', existingItem);

  const nome = await askQuestion('Digite o novo nome do filme (ou pressione Enter para manter o mesmo): ');
  const descricao = await askQuestion('Digite a nova descrição do filme (ou pressione Enter para manter a mesma): ');
  const genero = await askQuestion('Digite o novo gênero do filme (ou pressione Enter para manter o mesmo): ');
  const anoLancamentoInput = await askQuestion('Digite o novo ano de lançamento do filme (ou pressione Enter para manter o mesmo): ');

  const anoLancamento = anoLancamentoInput.trim() !== '' ? parseInt(anoLancamentoInput) : existingItem.anoLancamento;

  const updatedItem = {
    nome: nome || existingItem.nome,
    descricao: descricao || existingItem.descricao,
    genero: genero || existingItem.genero,
    anoLancamento
  };

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(itemId) },
    { $set: updatedItem },
    { returnDocument: 'after' }
  );

  client.close();

  console.log('Resultado da atualização do filme:', result);
}

async function deleteItem() {
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();

  const db = client.db(dbName);
  const collection = db.collection('items');

  const itemId = await askQuestion('Digite o ID do filme que deseja deletar: ');

  const result = await collection.findOneAndDelete({ _id: new ObjectId(itemId) });

  client.close();

  console.log('Resultado da exclusão do filme:', result);
}

async function listItems() {
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();

  const db = client.db(dbName);
  const collection = db.collection('items');

  const items = await collection.find().toArray();

  client.close();

  console.log('=== Lista de Filmes ===');
  console.log(items);
}

async function mainMenu() {
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n=== Menu ===');
  console.log('1. Criar Filme');
  console.log('2. Atualizar Filme');
  console.log('3. Deletar Filme');
  console.log('4. Listar Filmes');
  console.log('0. Sair');

  const choice = await askQuestion('Escolha uma opção: ');

  switch (choice) {
    case '1':
      await createItem();
      break;
    case '2':
      await updateItem();
      break;
    case '3':
      await deleteItem();
      break;
    case '4':
      await listItems();
      break;
    case '0':
      console.log('Encerrando o servidor...');
      rl.close();
      process.exit();
      break;
    default:
      console.log('Opção inválida. Tente novamente.');
  }

  mainMenu();
}

mainMenu();

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

process.on('SIGINT', () => {
  rl.close();
  process.exit();
});
