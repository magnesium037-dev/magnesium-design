// ==================== 动画输出格式 ====================
// AI 输出带动画的 HTML，用 animations.jsx 引擎
// 之后 render-video.js 录成 MP4/GIF

const ANIMATION_FORMAT = `
## 输出格式：带动画的 HTML 页面

你是动画师。请输出一个带时间轴动画的 HTML 页面。

技术约束：
1. 使用 React + Babel（CDN 引入），不用模块化 import
2. 使用 animations.jsx 的 Stage + Sprite + Easing + interpolate API
3. 动画时长 10-30 秒
4. 画面尺寸 1920×1080
5. Stage 组件自动设 window.__ready = true（录屏脚本依赖这个信号）

animations.jsx API：
- <Stage duration={10}> 动画容器
- <Sprite start={2} end={5}> 时间片段
- useTime() 读全局时间（秒）
- useSprite() 读本地进度 { t: 0→1, elapsed, duration }
- Easing: { linear, easeIn, easeOut, easeInOut, expoOut, spring }
- interpolate(t, [in0, in1], [out0, out1], easing?)

参考结构：
<html>
<body>
  <div id="root"></div>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <!-- 贴入 animations.jsx 完整代码 -->

  <script type="text/babel">
    function App() {
      return (
        <Stage duration={15}>
          <Sprite start={0} end={4}>
            <Title />
          </Sprite>
          <Sprite start={3} end={8}>
            <Content />
          </Sprite>
          <Sprite start={7} end={15}>
            <Conclusion />
          </Sprite>
        </Stage>
      );
    }

    function Title() {
      const { t } = useSprite();
      const opacity = Easing.expoOut(t);
      return <div style={{...}}>标题</div>;
    }

    ReactDOM.render(<App />, document.getElementById('root'));
  </script>
</body>
</html>
`;

function parseSlides(html) { return [{ html }]; }
function slideStats(slides) { return { total: 1, chars: slides[0] ? slides[0].html.length : 0 }; }

module.exports = { ANIMATION_FORMAT, parseSlides, slideStats };
