import express from 'express';
import Top from './controllers/top';
import Signup from './controllers/signup'
import Signin from './controllers/signin'
import IIIFAPI from './controllers/iiifApi';
import path from 'path';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';
import "dotenv/config";

declare module 'express-session' {
    interface SessionData {
        userId: string,
    }
}

const port: string | number = process.env.PORT || 3000;
const secret: string | undefined = process.env.SESSION_SECRET;
const app: express.Express = express();

app.use(
    cookieSession({
      name: "session",
      keys: [secret ? secret: ""],
      maxAge: 30 * 60 * 1000,
    })
);

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.resolve(__dirname, '../public')));
app.use(cookieParser());
app.use(cors());

mongoose.connect(process.env.DB_PATH ? process.env.DB_PATH: "");
mongoose.Promise = global.Promise;

app.use('/', Top);
app.use('/api', IIIFAPI);
app.use('/signup', Signup);
app.use('/signin', Signin);

app.listen(port, () => {
    console.log(`Server Established at ${port} Port`);
});