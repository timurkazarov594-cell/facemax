import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import stylistRouter from "./stylist.js";
import voyageRouter from "./voyage.js";
import authRouter from "./auth.js";
import paymentsRouter from "./payments.js";
import speakTutorRouter from "./speaktutor.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(stylistRouter);
router.use(voyageRouter);
router.use(authRouter);
router.use(paymentsRouter);
router.use(speakTutorRouter);

export default router;
