from flask import Flask, render_template
from flask.ext.assets import Environment, Bundle

app = Flask(__name__)

# clear the cache in the web browser when start the app
app.SEND_FILE_MAX_AGE_DEFAULT = 0

assets = Environment(app)
assets.url = app.static_url_path
app.config['ASSETS_DEBUG'] = True

scss = Bundle('css/main.scss', filters='pyscss', output='css/main.css')
assets.register('scss_main', scss)


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')



if __name__ == '__main__':
    app.run()
