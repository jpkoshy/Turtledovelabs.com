import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import categoriesRouter from "./categories";
import gigsRouter from "./gigs";
import searchRouter from "./search";
import ordersRouter from "./orders";
import reviewsRouter from "./reviews";
import messagesRouter from "./messages";
import paymentsRouter from "./payments";
import disputesRouter from "./disputes";
import adminRouter from "./admin";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/categories", categoriesRouter);
router.use("/gigs", gigsRouter);
router.use("/search", searchRouter);
router.use("/orders", ordersRouter);
router.use("/reviews", reviewsRouter);
router.use("/messages", messagesRouter);
router.use("/payments", paymentsRouter);
router.use("/disputes", disputesRouter);
router.use("/admin", adminRouter);
router.use("/notifications", notificationsRouter);

export default router;
