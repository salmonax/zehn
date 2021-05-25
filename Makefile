site:
	concurrently "lr-http-server --watchFiles \"*.html,*.css,*.js,*.yml\" -b" "pug --watch index.pug"
