import { createApp } from 'vue';
import * as echarts from 'echarts';
import VueECharts from 'vue-echarts';
import App from './App.vue';
import './styles/main.css';

const app = createApp(App);

app.component('v-chart', VueECharts);
app.config.globalProperties.$echarts = echarts;

app.mount('#app');
