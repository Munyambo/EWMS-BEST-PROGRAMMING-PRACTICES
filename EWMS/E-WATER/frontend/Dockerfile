# Serve static HTML/CSS/JS with nginx — lightweight and fast
FROM nginx:alpine

# Copy all frontend files into nginx's serving directory
COPY . /usr/share/nginx/html

# Custom nginx config to handle client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
