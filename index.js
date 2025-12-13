const express = require('express')
const cors = require('cors')
const app = express()

// CORS для фронтенда
app.use(
	cors({
		origin: 'http://localhost:3000',
		credentials: true,
	})
)

app.use(express.json())

// Временное хранилище постов
let posts = [
	{
		_id: '1',
		title: 'Добро пожаловать! 🎉',
		content: 'Это первый пост из бэкенда',
		author: { username: 'Система', avatar: '🤖' },
		likes: 10,
		comments: 5,
		timestamp: '1 час назад',
		liked: false,
	},
]

// API уязвимый маршруты
app.get('/api/posts', (req, res) => {
	console.log('GET /api/posts')
	res.json(posts)
})

app.post('/api/posts', (req, res) => {
	console.log('POST /api/posts', req.body)
	const { title, content, userId, author } = req.body

	const newPost = {
		_id: Date.now().toString(),
		title: title, // ⚠️ Может содержать скрипты!
		content: content, // ⚠️ Может содержать скрипты!
		author: author || { username: 'Пользователь', avatar: '😊' },
		likes: 0,
		comments: 0,
		timestamp: 'только что',
		liked: false,
	}
	posts.unshift(newPost)

	console.log('⚠️ ВНИМАНИЕ: Пост добавлен БЕЗ санитизации!')
	console.log('Заголовок:', title)
	console.log('Контент:', content)

	res.json(newPost)
})

const PORT = 5000
app.listen(PORT, () => {
	console.log(`✅ Backend запущен на http://localhost:${PORT}`)
})
