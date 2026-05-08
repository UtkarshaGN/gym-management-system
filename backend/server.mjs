import dotenv from "dotenv";
dotenv.config(); 


import express from "express";
import path from "path";

import { SessionController } from "./controllers/SessionController.mjs";
import { UserController } from "./controllers/UserController.mjs";
import { LocationController} from "./controllers/LocationController.mjs";
import { PostController } from "./controllers/PostController.mjs";
import { ActivityController } from "./controllers/ActivityController.mjs";
import { AuthController } from "./controllers/AuthController.mjs";
import { BookingController } from "./controllers/BookingController.mjs";
import { TrainerController } from "./controllers/TrainerController.mjs";
import { MemberController } from "./controllers/MemberController.mjs";
import { APIController } from "./controllers/api/APIController.mjs";

const app = express();
const port = 8080;

const adminOnly = AuthController.restrict(['admin']);

app.set("view engine", "ejs");
app.set("views", path.join(import.meta.dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(AuthController.middleware)

app.get("/", (req, res) => {
    if (req.authenticatedUser) {
        if (req.authenticatedUser.role === 'admin') return res.redirect('/user');
        if (req.authenticatedUser.role === 'trainer') return res.redirect('/trainer/sessions');
        if (req.authenticatedUser.role === 'member') return res.redirect('/member/sessions');
    }
    res.redirect("/blog");
});
app.get("/blog", PostController.viewAllPosts);
app.use("/auth", AuthController.routes);


app.use("/member", MemberController.routes);

app.use("/trainer", TrainerController.routes);

app.use("/sessions", adminOnly, SessionController.routes);
app.use("/user", adminOnly, UserController.routes);
app.use("/location", adminOnly, LocationController.routes);
app.use("/activity", adminOnly, ActivityController.routes);
app.use("/booking", adminOnly, BookingController.routes);
app.use("/posts/manage", adminOnly, PostController.routes); 
app.use("/post", adminOnly, PostController.routes);
app.use("/api", APIController.routes)

app.use(express.static(path.join(import.meta.dirname, "public")));

app.listen(port, () =>{
    console.log("Backend started on http://localhost:" + port);
});