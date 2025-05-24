import './assets/main.css'

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createApp } from 'vue'
import VueKonva from 'vue-konva'
import App from './App.vue'
import router from './router'

const vuetify = createVuetify({
  components,
  directives
})

const app = createApp(App)
app.use(vuetify)
app.use(VueKonva)
app.use(router)
app.mount('#app')
