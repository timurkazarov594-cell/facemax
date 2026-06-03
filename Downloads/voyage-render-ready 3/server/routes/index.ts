import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import voyageRouter from "./voyage.js";
import authRouter from "./auth.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(voyageRouter);
router.use(authRouter);

export default router;
