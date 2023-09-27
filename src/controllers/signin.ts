import express, { Router } from "express";
import users from "../db/users";
import bcrypt from "bcrypt";

const router: express.Router = Router();

router.get('/', (req: express.Request, res: express.Response) => {
    const userId: string | undefined = req.session.userId;
    const isAuth: boolean = Boolean(userId)
    if (isAuth) {
        res.redirect('/')
    } else {
        res.render('./signin', {
            errorMessage: null,
        });
    }
});

router.post('/', (req: express.Request, res:express.Response) => {
    const username: string = req.body.username;
    const password: string = req.body.password;

    users.find({username:username})
      .then(async (value: any) => {
        if (value.length===0) {
            res.render('signin', {
                errorMessage: "無効なユーザーです",
            });
        } else if (await bcrypt.compare(password, value[0].password)) {
            req.session.userId = value[0]._id.toString();
            console.log('認証に成功');
            res.redirect('/')
        } else {
            res.render('signin', {
                errorMessage: "パスワードが一致しません",
            });
        }
      })
      .catch((err:Error) => {
        res.render('signin', {
            errorMessage: err.toString(),
        });
      })
})

export default router;