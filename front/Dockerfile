# Usamos Nginx para servir los archivos estáticos
FROM nginx:alpine

# Copiamos la carpeta 'dist' (que generaste en tu PC) al servidor Nginx
COPY dist /usr/share/nginx/html

# Exponemos el puerto 80 interno
EXPOSE 80

# Arrancamos Nginx
CMD ["nginx", "-g", "daemon off;"]