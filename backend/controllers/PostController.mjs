import express from "express";
import { PostModel } from "../models/PostModel.mjs";


export class PostController {
  static routes = express.Router();

  static {
 
    this.routes.get("/add", this.viewAddPostForm);
    this.routes.get("/edit/:id", this.viewEditPostForm);
    
    
    this.routes.get("/", this.viewPostManagement);
    this.routes.post("/", this.handlePostManagement); 
    this.routes.post("/:id", this.handlePostManagement); 
  }

  // For the public-facing blog page
  static viewAllPosts(req, res) {
    PostModel.getAllWithAuthors()
      .then((posts) => {
        res.render("homepage.ejs", { posts });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error fetching posts.");
      });
  }

  
  static async viewPostManagement(req, res) {
  try {
    const { sortBy, order, author, title, content, date } = req.query;

    // Fetch posts with filters
    const posts = await PostModel.getAllWithAuthors(sortBy, 
      order,
       { author, 
        title, 
        content, 
        date });

    res.render("admin_post.ejs", {
      sortBy,
      order,
      posts,
      query: req.query, // Pass filters back to EJS
      path: req.path,
      page: "blogs",
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("status.ejs", {
      status: "Error",
      message: "Could not load post management page.",
    });
  }
}


  // New method to render the add form
  static viewAddPostForm(req, res) {
    res.render("admin_post_form.ejs", {
      post: null,
      page: 'blogs'
    });
  }

  // New method to render the edit form
  static async viewEditPostForm(req, res) {
    try {
      const post = await PostModel.getById(req.params.id);
      res.render("admin_post_form.ejs", {
        post,
        page: 'blogs'
      });
    } catch (error) {
      res.status(404).render("status.ejs", { status: "Error", message: "Post not found" });
    }
  }
static handlePostManagement(req, res) {
  const postId = req.params.id;
  const { action, title, content } = req.body;
  const userId = req.authenticatedUser ? req.authenticatedUser.userId : null;

  if (!userId) {
    return res.status(401).send("You must be logged in to manage posts.");
  }

  //  Regex patterns
  const titlePattern = /^[A-Za-z0-9\s.,?!:'’\-()]{3,100}$/; 
  // Allows letters, numbers, spaces, and safe punctuation (3–100 chars)

  const contentPattern = /^[A-Za-z0-9\s.,?!:'"“”\-()\n\r&;]+$/; 
  // Allows normal writing with punctuation and line breaks, no HTML or code

  //  Validation checks
  if (!titlePattern.test(title)) {
    return res.status(400).send("Invalid title format. Only letters, numbers and normal punctuation are allowed.");
  }

  if (!contentPattern.test(content)) {
    return res.status(400).send("Invalid content format. Avoid HTML tags,special symbols.");
  }

  // Proceed with CRUD actions if validation passes
  if (action === "create") {
    const newPost = { userId, title, content, createdAt: new Date() };
    PostModel.create(newPost)
      .then(() => res.redirect("/posts/manage"))
      .catch((err) => {
        console.error(err);
        res.status(500).send("Failed to create post.");
      });
  } else if (action === "update") {
    const updatedPost = { postId, title, content };
    PostModel.update(updatedPost)
      .then(() => res.redirect("/posts/manage"))
      .catch((err) => {
        console.error(err);
        res.status(500).send("Failed to update post.");
      });
  } else if (action === "delete") {
    PostModel.delete(postId)
      .then(() => res.redirect("/posts/manage"))
      .catch((err) => {
        console.error(err);
        res.status(500).send("Failed to delete post.");
      });
  } else {
    res.status(400).send("Invalid action.");
  }
}


















  // working code without regex
  // static handlePostManagement(req, res) {
  //   const postId = req.params.id;
  //  const { action, title, content } = req.body;
  //   const userId = req.authenticatedUser ? req.authenticatedUser.userId : null;

  //  if (!userId) {
  //     return res.status(401).send("You must be logged in to manage posts.");
  //   }

  //   if (action === "create") {
  //     const newPost = { userId, title, content, createdAt: new Date() };
  //     PostModel.create(newPost)
  //       .then(() => res.redirect("/posts/manage")) 
  //       .catch((err) => {
  //         console.error(err);
  //         res.status(500).send("Failed to create post.");
  //       });
  //   } else if (action === "update") {
  //     const updatedPost = { postId, title, content };
  //     PostModel.update(updatedPost)
  //       .then(() => res.redirect("/posts/manage"))
  //       .catch((err) => {
  //         console.error(err);
  //         res.status(500).send("Failed to update post.");
  //       });
  //   } else if (action === "delete") {
  //     PostModel.delete(postId)
  //       .then(() => res.redirect("/posts/manage"))
  //       .catch((err) => {
  //         console.error(err);
  //         res.status(500).send("Failed to delete post.");
  //       });
  // } else {
  //     res.status(400).send("Invalid action.");
  //    }
  //  }
}