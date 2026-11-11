import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { z } from 'zod';

const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || 'local-development-secret-change-before-deploy';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

interface AuthRequest extends Request { user?: { id: string; email: string; role: string } }
function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  try { req.user = jwt.verify(header.slice(7), jwtSecret) as AuthRequest['user']; next(); }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
}
const startupSchema = z.object({
  name: z.string().trim().min(2).max(160), founderName: z.string().trim().min(2).max(120),
  email: z.string().email().max(180), sector: z.string().trim().min(2).max(100),
  stage: z.enum(['Idea','Prototype','MVP','Growth']).default('Idea'),
  status: z.enum(['Under Review','Accepted','In Progress','Graduated','Rejected']).default('Under Review'),
  programId: z.string().uuid().nullable().optional()
});

app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', service: 'IncubaCloud API', database: 'connected', timestamp: new Date().toISOString() }); }
  catch { res.status(503).json({ status: 'error', database: 'unavailable' }); }
});

app.post('/api/auth/register', async (req, res) => {
  const schema = z.object({ fullName: z.string().min(2).max(120), email: z.string().email(), password: z.string().min(8) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid registration details', details: parsed.error.flatten() });
  try {
    const hash = await bcrypt.hash(parsed.data.password, 12);
    const result = await pool.query('INSERT INTO users(full_name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,full_name,email,role', [parsed.data.fullName, parsed.data.email.toLowerCase(), hash, 'admin']);
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: '8h' });
    res.status(201).json({ token, user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role } });
  } catch (error: any) { res.status(error.code === '23505' ? 409 : 500).json({ error: error.code === '23505' ? 'Email already registered' : 'Could not create account' }); }
});

app.post('/api/auth/login', async (req, res) => {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Email and password are required' });
  const result = await pool.query('SELECT * FROM users WHERE email=$1', [parsed.data.email.toLowerCase()]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) return res.status(401).json({ error: 'Invalid email or password' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role } });
});

app.get('/api/dashboard', authenticate, async (_req, res) => {
  const [startups, programs, milestones, statusRows, recent] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status=$1)::int AS active, COUNT(*) FILTER (WHERE status=$2)::int AS review FROM startups', ['In Progress','Under Review']),
    pool.query('SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status=$1)::int AS active FROM programs', ['active']),
    pool.query('SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE completed)::int AS completed FROM milestones'),
    pool.query('SELECT status, COUNT(*)::int AS count FROM startups GROUP BY status ORDER BY count DESC'),
    pool.query(`SELECT s.id,s.name,s.founder_name,s.sector,s.stage,s.status,s.created_at,p.name AS program_name FROM startups s LEFT JOIN programs p ON p.id=s.program_id ORDER BY s.created_at DESC LIMIT 5`)
  ]);
  res.json({ stats: { startups: startups.rows[0], programs: programs.rows[0], milestones: milestones.rows[0] }, statusBreakdown: statusRows.rows, recentStartups: recent.rows });
});

app.get('/api/startups', authenticate, async (req, res) => {
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || '').trim();
  const result = await pool.query(`SELECT s.id,s.name,s.founder_name,s.email,s.sector,s.stage,s.status,s.program_id,s.created_at,p.name AS program_name FROM startups s LEFT JOIN programs p ON p.id=s.program_id WHERE ($1='' OR s.name ILIKE '%'||$1||'%' OR s.founder_name ILIKE '%'||$1||'%' OR s.sector ILIKE '%'||$1||'%') AND ($2='' OR s.status=$2) ORDER BY s.created_at DESC`, [search, status]);
  res.json({ data: result.rows });
});

app.post('/api/startups', authenticate, async (req, res) => {
  const parsed = startupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Please check the startup details', details: parsed.error.flatten() });
  const d = parsed.data;
  try {
    const result = await pool.query(`INSERT INTO startups(name,founder_name,email,sector,stage,status,program_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [d.name,d.founderName,d.email,d.sector,d.stage,d.status,d.programId || null]);
    res.status(201).json({ data: result.rows[0] });
  } catch { res.status(500).json({ error: 'Could not create startup. Check the selected program.' }); }
});

app.patch('/api/startups/:id/status', authenticate, async (req, res) => {
  const parsed = z.object({ status: z.enum(['Under Review','Accepted','In Progress','Graduated','Rejected']) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid status' });
  const result = await pool.query('UPDATE startups SET status=$1 WHERE id=$2 RETURNING *', [parsed.data.status, req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Startup not found' });
  res.json({ data: result.rows[0] });
});

app.delete('/api/startups/:id', authenticate, async (req, res) => {
  const result = await pool.query('DELETE FROM startups WHERE id=$1 RETURNING id', [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Startup not found' });
  res.status(204).send();
});

app.get('/api/programs', authenticate, async (_req, res) => {
  const result = await pool.query(`SELECT p.*, COUNT(s.id)::int AS startup_count FROM programs p LEFT JOIN startups s ON s.program_id=p.id GROUP BY p.id ORDER BY p.created_at DESC`);
  res.json({ data: result.rows });
});

app.get('/api/milestones', authenticate, async (_req, res) => {
  const result = await pool.query(`SELECT m.*,s.name AS startup_name FROM milestones m JOIN startups s ON s.id=m.startup_id ORDER BY m.due_date ASC NULLS LAST`);
  res.json({ data: result.rows });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.message);
  res.status(500).json({ error: 'Unexpected server error' });
});

app.listen(port, '0.0.0.0', () => console.log(`IncubaCloud API listening on port ${port}`));