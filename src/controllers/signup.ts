import express, { Router } from 'express';
import bcrypt from 'bcrypt';
import users from '../db/users';

let router: Router = express.Router();

router.get('/', function(req: express.Request, res: express.Response){
  res.render('./signup.ejs');
});
  
router.post('/', function(req: express.Request, res: express.Response){
  let username: string = req.body.username;
  let password: string = req.body.password;
  let repassword: string = req.body.repassword;

  users.find({username:username})
    .then(async (value: {}[]) => {
        if (value.length!==0) {
            res.render('./signup.ejs', {
                errorMessage: ["このユーザー名は既に使われてます。"]
            });
        } else {
            if (password===repassword) {
                const hash: string = await bcrypt.hash(password, 10);
                users.create({
                    username:username,
                    password:hash,
                })
                  .then(() => res.redirect('/'))
                  .catch((error: Error) => {
                    console.log(error);
                    res.send(500);
                  });
            } else {
                res.render('./signup.ejs', {
                    errorMessage: ["パスワードが一致しません。"]
                });
            }
        }
    })
    .catch((err: Error) => {
        console.log(err);
        res.send(500);
    })
});

export default router;