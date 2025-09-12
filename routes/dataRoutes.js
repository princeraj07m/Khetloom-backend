const express = require('express');
const auth = require('../middleware/authMiddleware');
const Device = require('../models/Device');
const Field = require('../models/Field');
const Crop = require('../models/Crop');
const Job = require('../models/Job');
const Finance = require('../models/Finance');
const HealthReport = require('../models/HealthReport');
const WeatherCache = require('../models/WeatherCache');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const AppLog = require('../models/AppLog');
const Settings = require('../models/Settings');

const router = express.Router();

// Helper to attach userId to payloads
const withUser = (req, body = {}) => ({ ...body, userId: req.user.userId });

// Devices
router.post('/devices', auth, async (req, res) => {
  try { const doc = await Device.create(withUser(req, req.body)); res.status(201).json({ success: true, device: doc }); }
  catch (e) { res.status(400).json({ success: false, message: e.message }); }
});
router.get('/devices', auth, async (req, res) => {
  const docs = await Device.find({ userId: req.user.userId }).sort({ createdAt: -1 });
  res.json({ success: true, devices: docs });
});
router.get('/devices/:id', auth, async (req, res) => {
  const doc = await Device.findOne({ _id: req.params.id, userId: req.user.userId });
  if (!doc) return res.status(404).json({ success: false, message: 'Device not found' });
  res.json({ success: true, device: doc });
});
router.put('/devices/:id', auth, async (req, res) => {
  const doc = await Device.findOneAndUpdate({ _id: req.params.id, userId: req.user.userId }, req.body, { new: true });
  if (!doc) return res.status(404).json({ success: false, message: 'Device not found' });
  res.json({ success: true, device: doc });
});
router.delete('/devices/:id', auth, async (req, res) => {
  const doc = await Device.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
  if (!doc) return res.status(404).json({ success: false, message: 'Device not found' });
  res.json({ success: true });
});

// Fields
router.post('/fields', auth, async (req, res) => {
  try { const doc = await Field.create(withUser(req, req.body)); res.status(201).json({ success: true, field: doc }); }
  catch (e) { res.status(400).json({ success: false, message: e.message }); }
});
router.get('/fields', auth, async (req, res) => {
  const docs = await Field.find({ userId: req.user.userId }).sort({ createdAt: -1 });
  res.json({ success: true, fields: docs });
});
router.put('/fields/:id', auth, async (req, res) => {
  const doc = await Field.findOneAndUpdate({ _id: req.params.id, userId: req.user.userId }, req.body, { new: true });
  if (!doc) return res.status(404).json({ success: false, message: 'Field not found' });
  res.json({ success: true, field: doc });
});
router.delete('/fields/:id', auth, async (req, res) => {
  const doc = await Field.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
  if (!doc) return res.status(404).json({ success: false, message: 'Field not found' });
  res.json({ success: true });
});

// Crops
router.post('/crops', auth, async (req, res) => {
  try { const doc = await Crop.create(withUser(req, req.body)); res.status(201).json({ success: true, crop: doc }); }
  catch (e) { res.status(400).json({ success: false, message: e.message }); }
});
router.get('/crops', auth, async (req, res) => {
  const docs = await Crop.find({ userId: req.user.userId }).sort({ createdAt: -1 });
  res.json({ success: true, crops: docs });
});
router.put('/crops/:id', auth, async (req, res) => {
  const doc = await Crop.findOneAndUpdate({ _id: req.params.id, userId: req.user.userId }, req.body, { new: true });
  if (!doc) return res.status(404).json({ success: false, message: 'Crop not found' });
  res.json({ success: true, crop: doc });
});
router.delete('/crops/:id', auth, async (req, res) => {
  const doc = await Crop.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
  if (!doc) return res.status(404).json({ success: false, message: 'Crop not found' });
  res.json({ success: true });
});

// Jobs
router.post('/jobs', auth, async (req, res) => {
  try { const doc = await Job.create(withUser(req, req.body)); res.status(201).json({ success: true, job: doc }); }
  catch (e) { res.status(400).json({ success: false, message: e.message }); }
});
router.get('/jobs', auth, async (req, res) => {
  const docs = await Job.find({ userId: req.user.userId }).sort({ createdAt: -1 });
  res.json({ success: true, jobs: docs });
});
router.put('/jobs/:id', auth, async (req, res) => {
  const doc = await Job.findOneAndUpdate({ _id: req.params.id, userId: req.user.userId }, req.body, { new: true });
  if (!doc) return res.status(404).json({ success: false, message: 'Job not found' });
  res.json({ success: true, job: doc });
});
router.delete('/jobs/:id', auth, async (req, res) => {
  const doc = await Job.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
  if (!doc) return res.status(404).json({ success: false, message: 'Job not found' });
  res.json({ success: true });
});

// Finance
router.post('/finance', auth, async (req, res) => {
  try { const doc = await Finance.create(withUser(req, req.body)); res.status(201).json({ success: true, entry: doc }); }
  catch (e) { res.status(400).json({ success: false, message: e.message }); }
});
router.get('/finance', auth, async (req, res) => {
  const docs = await Finance.find({ userId: req.user.userId }).sort({ date: -1 });
  res.json({ success: true, entries: docs });
});
router.get('/finance/summary', auth, async (req, res) => {
  const entries = await Finance.find({ userId: req.user.userId });
  const income = entries.filter(e => e.type === 'income').reduce((a,b)=>a+b.amount,0);
  const expense = entries.filter(e => e.type === 'expense').reduce((a,b)=>a+b.amount,0);
  res.json({ success: true, income, expense, balance: income - expense });
});

// Health Reports
router.post('/health-reports', auth, async (req, res) => {
  try { const doc = await HealthReport.create(withUser(req, req.body)); res.status(201).json({ success: true, report: doc }); }
  catch (e) { res.status(400).json({ success: false, message: e.message }); }
});
router.get('/health-reports', auth, async (req, res) => {
  const docs = await HealthReport.find({ userId: req.user.userId }).sort({ createdAt: -1 });
  res.json({ success: true, reports: docs });
});

// Weather Cache
router.get('/weather', auth, async (req, res) => {
  const { location } = req.query;
  if (!location) return res.status(400).json({ success: false, message: 'location is required' });
  const cache = await WeatherCache.findOne({ location });
  const valid = cache && cache.ttl > new Date();
  res.json({ success: true, cached: !!valid, data: valid ? cache.data : null });
});
router.post('/weather', auth, async (req, res) => {
  const { location, data, ttlMinutes } = req.body;
  if (!location || !data) return res.status(400).json({ success: false, message: 'location and data are required' });
  const ttl = new Date(Date.now() + (ttlMinutes || 60) * 60000);
  const doc = await WeatherCache.findOneAndUpdate({ location }, { userId: req.user.userId, location, data, ttl }, { new: true, upsert: true });
  res.status(201).json({ success: true, cache: doc });
});

// Notifications
router.post('/notifications', auth, async (req, res) => {
  const doc = await Notification.create(withUser(req, req.body));
  res.status(201).json({ success: true, notification: doc });
});
router.get('/notifications', auth, async (req, res) => {
  const docs = await Notification.find({ userId: req.user.userId }).sort({ createdAt: -1 });
  res.json({ success: true, notifications: docs });
});
router.put('/notifications/:id/read', auth, async (req, res) => {
  const doc = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user.userId }, { read: true }, { new: true });
  if (!doc) return res.status(404).json({ success: false, message: 'Notification not found' });
  res.json({ success: true, notification: doc });
});

// Activities
router.post('/activities', auth, async (req, res) => {
  const doc = await Activity.create(withUser(req, req.body));
  res.status(201).json({ success: true, activity: doc });
});
router.get('/activities/recent', auth, async (req, res) => {
  const docs = await Activity.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(20);
  res.json({ success: true, activities: docs });
});

// App logs
router.post('/logs', async (req, res) => {
  const doc = await AppLog.create({ level: req.body.level || 'info', message: req.body.message, meta: req.body.meta });
  res.status(201).json({ success: true, log: doc });
});
router.get('/logs/recent', auth, async (req, res) => {
  const docs = await AppLog.find({}).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, logs: docs });
});

// Settings (per user)
router.get('/settings', auth, async (req, res) => {
  const set = await Settings.findOne({ userId: req.user.userId });
  res.json({ success: true, settings: set || null });
});
router.post('/settings', auth, async (req, res) => {
  const set = await Settings.findOneAndUpdate(
    { userId: req.user.userId },
    { ...req.body, userId: req.user.userId },
    { upsert: true, new: true }
  );
  res.status(201).json({ success: true, settings: set });
});

module.exports = router;


