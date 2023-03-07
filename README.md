# Topicos Especiales de Telematica - Reto Practico 1

## Información de la asignatura

Despligue de tres microservicios y una ApiGW que se comuniquen entre ellos por medio de gRPC

## Titulo del Proyecto

E-commerce generico

## Datos del Estudiante

Nombre:
Julian David Bueno Londoño

Codigo EPIK:
1000109141

## Descripción y alcance del proyecto

El proyecto consiste en desplegar tres microservicios y una ApiGW, la aplicación es una de e-commerce y los tres microservicios son Inventory, ShopCart y Shipping.

## Estructura del proyecto

6 carpeta.

Inventory contiene el micro-servicio de Inventory y sus respectivas variables de entorno y db.json que es un fichero simulando una base de datos.

Shopcart contiene el micro-servicio de ShopCart y sus respectivas variables de entorno y db.json.

Shipping contiene el micro-servicio de Shipping, sus respectivas variables de entorno y db.json y un package.json que contiene las librerias a instalar de node.

ApiGW contiene el servidor, variables de entorno y las librerias a instalar en el package.json.

protos contiene los archivos de proto buffer, uno por cada microservicio

imgs contiene imagenes para la documentación

aparte de las 6 carpetas se encuentra el archivo README.md en el directorio raiz que contiene información acerca del uso y despliegue de la aplicación.

## Arquitectura de la solución planteada.

