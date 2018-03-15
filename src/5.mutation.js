const express = require('express');
const app = express();
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const { connect } = require('./helper');
const MessageModel = require('./models/Message');

connect()
  .on('error', console.error.bind(console, 'connection error:'))
  .on('disconnected', () => console.log('MongoDB disconnected'))
  .once('open', listen);

// 使用 GraphQL schema language 构建 schema
const schema = buildSchema(`
  input MessageInput {
    content: String
    author: String
  }

  type Message {
    id: ID!
    content: String
    author: String
  }

  type Query {
    getMessage(id: ID!): Message
  }

  type Mutation {
    createMessage(input: MessageInput): Message
    updateMessage(id: ID!, input: MessageInput): Message
  }
`);

// 如果 Message 拥有复杂字段，我们把它们放在这个对象里面。
class Message {
  constructor(id, {content, author}) {
    this.id = id;
    this.content = content;
    this.author = author;
  }
}

const fakeDatabase = {};

const root = {
  getMessage: function ({id}) {
    if (!fakeDatabase[id]) {
      throw new Error('no message exists with id ' + id);
    }
    return new Message(id, fakeDatabase[id]);
  },
  createMessage: function ({input}) {
    // Create a random id for our "database".
    const id = require('crypto').randomBytes(10).toString('hex');

    fakeDatabase[id] = input;

    // let payload = {
    //   id: 1,
    //   content: 'hello',
    //   author: 'jack'
    // }
    const model = new MessageModel(input)
    model.save((err, message) => {
      if (err) {
        throw new Error(err);
      }
      return message;
    })

    // return new Message(id, input);
  },
  updateMessage: function ({id, input}) {
    MessageModel.findByIdAndUpdate(id, input, (err, message) => {
      console.log(message)
    })

    /*
    if (!fakeDatabase[id]) {
      throw new Error('no message exists with id ' + id);
    }
    // This replaces all old data, but some apps might want partial update.
    fakeDatabase[id] = input;
    return new Message(id, input);
    */
  },
};



function listen() {
  app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  }));

  app.listen(4000);
  console.log('Running a GraphQL API server at localhost:4000/graphql');
}




/*
mutation {
  createMessage(input: {
    author: "andy",
    content: "hope is a good thing",
  }) {
    id
  }
}


{
  getMessage(id: "51511cd274f244a9ca25") {
    id
    content
    author
  }
}


mutation {
  updateMessage(id: "51511cd274f244a9ca25",
  input: {content: "bar", author: "jack"}) {
    id
  }
}

* */
