import { Router, type IRouter } from "express";
import healthRouter from "./health";
import wordpressRouter from "./wordpress";
import systemRouter from "./system";
import publicAppRouter from "./public-app";

const router: IRouter = Router();

router.use(healthRouter);
router.use(wordpressRouter);
router.use(systemRouter);
router.use(publicAppRouter);

export default router;
