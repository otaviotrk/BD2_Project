const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const readline = require('readline');

const app = express();
const port = 3333;

mongoose.connect('mongodb://localhost:27017/LocadoraDeFilmes', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemSchema = new mongoose.Schema({
  nome: String,
  descricao: String,
  genero: String,
  anoLancamento: Number
});

const Item = mongoose.model('Item', itemSchema);

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
  const nome = await askQuestion('Digite o nome do filme: ');
  const descricao = await askQuestion('Digite a descrição do filme: ');
  const genero = await askQuestion('Digite o gênero do filme: ');
  const anoLancamento = parseInt(await askQuestion('Digite o ano de lançamento do filme: '));

  const newItem = new Item({ nome, descricao, genero, anoLancamento });

  try {
    await newItem.save();
    console.log('Filme criado com sucesso:', newItem);
  } catch (error) {
    console.error('Erro ao criar filme:', error.message);
  }
}

async function updateItem() {
  const itemId = await askQuestion('Digite o ID do filme que deseja atualizar: ');

  try {
    const item = await Item.findById(itemId);

    if (!item) {
      console.log('Filme não encontrado.');
      return;
    }

    console.log('Detalhes do filme atual:', item);

    const nome = await askQuestion('Digite o novo nome do filme (ou pressione Enter para manter o mesmo): ');
    const descricao = await askQuestion('Digite a nova descrição do filme (ou pressione Enter para manter a mesma): ');
    const genero = await askQuestion('Digite o novo gênero do filme (ou pressione Enter para manter o mesmo): ');
    const anoLancamentoInput = await askQuestion('Digite o novo ano de lançamento do filme (ou pressione Enter para manter o mesmo): ');

    const anoLancamento = anoLancamentoInput.trim() !== '' ? parseInt(anoLancamentoInput) : item.anoLancamento;

    item.nome = nome || item.nome;
    item.descricao = descricao || item.descricao;
    item.genero = genero || item.genero;
    item.anoLancamento = anoLancamento;

    await item.save();

    console.log('Filme atualizado com sucesso:', item);
  } catch (error) {
    console.error('Erro ao atualizar filme:', error.message);
  }
}

async function deleteItem() {
  const itemId = await askQuestion('Digite o ID do filme que deseja deletar: ');

  try {
    const item = await Item.findByIdAndDelete(itemId);

    if (!item) {
      console.log('Filme não encontrado.');
      return;
    }

    console.log('Filme deletado com sucesso:', item);
  } catch (error) {
    console.error('Erro ao deletar filme:', error.message);
  }
}

async function mainMenu() {

  await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar alguns segundos para melhor visualização

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
      const items = await Item.find();
      console.log('=== Lista de Filmes ===');
      console.log(items);
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

// Inicia o menu principal
mainMenu();

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Fechar a interface readline quando o servidor for encerrado
process.on('SIGINT', () => {
  rl.close();
  process.exit();
});
