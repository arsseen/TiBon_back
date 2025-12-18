// ============================================
// TiBon_back/index.js (Добавьте к существующему коду)
// ============================================

const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const app = express()

app.use(
	cors({
		origin: 'http://localhost:3000',
		credentials: true,
	})
)

app.use(express.json())

if (!fs.existsSync('uploads')) {
	fs.mkdirSync('uploads')
}

app.use('/uploads', express.static('uploads'))

// ❌ УЯЗВИМАЯ КОНФИГУРАЦИЯ MULTER - Принимает ВСЕ файлы!
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads/')
	},
	filename: (req, file, cb) => {
		// ❌ УЯЗВИМОСТЬ: Сохраняем с оригинальным расширением
		const originalName = file.originalname
		cb(null, Date.now() + '-' + originalName)
	},
})

app.post('/api/login', (req, res) => {
	const { email, password } = req.body
	console.log('⚠️ Попытка входа БЕЗ rate limiting')

	// Слабая проверка
	if (email === 'admin@test.com' && password === 'admin') {
		res.json({
			message: 'Успешный вход',
			user: { id: 1, username: 'Admin', email, avatar: '👑' },
			token: 'simple-token-123',
		})
	} else {
		res.status(401).json({ error: 'Неверные данные' })
	}
})

// ❌ УЯЗВИМОСТЬ: Нет CSRF защиты
app.post('/api/change-email', (req, res) => {
	const { userId, newEmail } = req.body

	console.log('⚠️ Email изменен БЕЗ CSRF токена!')
	console.log('User ID:', userId)
	console.log('New Email:', newEmail)

	// Имитация изменения
	res.json({
		message: 'Email изменен (БЕЗ CSRF защиты!)',
		newEmail,
	})
})

// ❌ УЯЗВИМОСТЬ: Нет проверки типа файла и размера!
const upload = multer({
	storage: storage,
})

let uploadedFiles = []

let posts = [
	{
		_id: '1',
		title: 'Добро пожаловать! 🎉',
		content: 'Попробуйте загрузить файлы! Есть уязвимости 😈',
		author: { username: 'Система', avatar: '🤖' },
		likes: 10,
		comments: 5,
		timestamp: '1 час назад',
		liked: false,
		file: null,
	},
]

// ❌ УЯЗВИМЫЙ ENDPOINT - Загрузка файлов без проверки
app.post('/api/upload', upload.single('file'), (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'Файл не выбран' })
		}

		console.log('⚠️ ФАЙЛ ЗАГРУЖЕН БЕЗ ПРОВЕРКИ:')
		console.log('Имя:', req.file.originalname)
		console.log('Тип:', req.file.mimetype)
		console.log('Размер:', req.file.size, 'байт')
		console.log('Путь:', req.file.path)

		const fileInfo = {
			id: Date.now().toString(),
			originalName: req.file.originalname,
			filename: req.file.filename,
			mimetype: req.file.mimetype,
			size: req.file.size,
			path: `/uploads/${req.file.filename}`,
			uploadedAt: new Date().toISOString(),
		}

		uploadedFiles.push(fileInfo)

		res.json({
			message: 'Файл загружен (БЕЗ ПРОВЕРКИ!)',
			file: fileInfo,
		})
	} catch (error) {
		console.error('Ошибка загрузки:', error)
		res.status(500).json({ error: 'Ошибка сервера' })
	}
})

app.get('/api/uploads', (req, res) => {
	res.json(uploadedFiles)
})

app.delete('/api/uploads/:id', (req, res) => {
	const { id } = req.params
	const fileIndex = uploadedFiles.findIndex(f => f.id === id)

	if (fileIndex === -1) {
		return res.status(404).json({ error: 'Файл не найден' })
	}

	const file = uploadedFiles[fileIndex]
	const filePath = path.join(__dirname, 'uploads', file.filename)

	if (fs.existsSync(filePath)) {
		fs.unlinkSync(filePath)
	}

	uploadedFiles.splice(fileIndex, 1)
	res.json({ message: 'Файл удален' })
})

app.post('/api/posts', (req, res) => {
	const { title, content, userId, author, fileId } = req.body

	let attachedFile = null
	if (fileId) {
		attachedFile = uploadedFiles.find(f => f.id === fileId)
	}

	const newPost = {
		_id: Date.now().toString(),
		title: title,
		content: content,
		author: author || { username: 'Пользователь', avatar: '😊' },
		likes: 0,
		comments: 0,
		timestamp: 'только что',
		liked: false,
		file: attachedFile,
	}

	posts.unshift(newPost)
	res.json(newPost)
})

app.get('/api/posts', (req, res) => {
	res.json(posts)
})

app.get('/', (req, res) => {
	res.json({
		message: '⚠️ Backend с УЯЗВИМОЙ загрузкой файлов',
		vulnerabilities: [
			'Нет проверки типа файла',
			'Нет ограничения размера',
			'Нет проверки расширения',
			'Файлы доступны напрямую через URL',
			'Можно загрузить исполняемые файлы',
		],
	})
})

const PORT = 5000
app.listen(PORT, () => {
	console.log(`✅ Backend запущен на http://localhost:${PORT}`)
	console.log(`⚠️ УЯЗВИМАЯ загрузка файлов активна!`)
	console.log(`⚠️ Папка uploads: ${path.join(__dirname, 'uploads')}`)
})
