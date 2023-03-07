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

![alt text](https://raw.githubusercontent.com/jdbuenol/TelematicaReto1/main/imgs/arquitectura.png)

Se utiliza una comunicación REST con el ApiGW, el ApiGW usa gRPC para comunicarse con cada microservicio y cada microservicio tiene un archivo de persistencia db.json que es unico para cada microservicio.

## Resultados Logrados

- Se logro implementar los tres microservicios e intercomunicarlos entre ellos por medio de gRPC.
- Se logro implementar un ApiGW que se comunique con los tres microservicios a traves de gRPC y el ApiGW es accesible por medio de HTTP (REST). 
- Se pudo desplegar los tres micro-servicios y el ApiGW de forma local en una misma maquina. 
- Sin embargo no se pudo desplegar la aplicación en AWS en 4 maquinas EC2 distintas, se tuvieron dificultades al momento de instalar NODE en las maquinas concernientes.
- No se siguieron principios de codigo limpio, principalmente por desconocimiento del lenguaje Ruby y por no estar familiarizado con el workflow de protobuffer.

## Descripción tecnica de la solución implementada

La aplicación consiste de tres microservicios y un ApiGW, los microservicios Inventory y ShopCart estan implementados en el lenguaje Ruby, mientras que el microservicio Shipping esta implementado en NodeJS, finalmente el ApiGW esta implementado en NodeJS usando el framework unopinionated ExpressJS.

Se procede a explicar los requisitos y forma de instalación de cada micro-servicio y del ApIGW

### ShopCart microservice

Requisitos:

- ruby v3.1.3^
- git v2.39^

Proceso de instalación y despliegue:

- Se clona el repositorio del proyecto `git clone https://github.com/jdbuenol/TelematicaReto1`
- Se mueve a la carpeta del microservicio Shopcart `cd ./TelematicaReto1/ShopCart`
- Se instala gRPC `gem install grpc`
- Se instalan las herramientas de compilacion `gem install grpc-tools`
- Se crea la carpeta de librerias `mkdir lib`
- Se compilan los protos de ShopCart `grpc_tools_ruby_protoc -I ../protos --ruby_out=./lib --grpc_out=./lib ../protos/shopcart.proto`
- Se compilan los protos de Inventory `grpc_tools_ruby_protoc -I ../protos --ruby_out=./lib --grpc_out=./lib ../protos/inventory.proto`
- Se edita el archivo .env cambiando la variable port por el puerto en que se desplegara el microservicio ShopCart y la variable inventory_port con la ip y puerto del microservicio Inventory
- Se despliega el servicio `ruby main.ru`

### Inventory microservice

Requisitos:

- ruby v3.1.3^
- git v2.39^

Proceso de instalación y despliegue:

- Se clona el repositorio del proyecto `git clone https://github.com/jdbuenol/TelematicaReto1`
- Se mueve a la carpeta del microservicio Inventory `cd ./TelematicaReto1/Inventory`
- Se instala gRPC `gem install grpc`
- Se instalan las herramientas de compilacion `gem install grpc-tools`
- Se crea la carpeta de librerias `mkdir lib`
- Se compilan los protos de Inventory `grpc_tools_ruby_protoc -I ../protos --ruby_out=./lib --grpc_out=./lib ../protos/inventory.proto`
- Se edita el archivo .env cambiando la variable port por el puerto en que se desplegara el microservicio Inventory
- Se despliega el servicio `ruby main.ru`

### Shipping microservice

requisitos:

- node v19.4.0^
- git v2.39^

Proceso de instalación y despliegue:

- Se clona el repositorio del proyecto `git clone https://github.com/jdbuenol/TelematicaReto1`
- Se mueve a la carpeta del microservicio Shipping `cd ./TelematicaReto1/Shipping`
- Se instalan las librerias `npm install`
- Se edita el archivo .env cambiando la variable PORT por el puerto en que se desplegara el microservicio Shipping y el resto con la ip y puerto en que esten desplegados los otros microservicios
- Se despliega el servicio `node main.js`

### Api GateWay

requisitos:

- node v19.4.0^
- git v2.39^

Proceso de instalación y despliegue:

- Se clona el repositorio del proyecto `git clone https://github.com/jdbuenol/TelematicaReto1`
- Se mueve a la carpeta del Api GateWay `cd ./TelematicaReto1/ApiGW`
- Se instalan las librerias `npm install`
- Se edita el archivo .env cambiando la variable PORT por el puerto en que se desplegara el ApiGW y el resto con la ip y puerto en que esten desplegados los microservicios
- Se despliega el ApiGW `node server.js`

## Guía de uso

El ApiGW consiste de 15 endpoints. en esta guia se pusieron a correr los tres microservicios y el ApiGW en la misma maquina, el ApiGW esta corriendo en el puerto 50054.

### Crear un item en el inventario con ID 1 (los items se crean con cantidad 0)

![]()

![]()

### Eliminar un item con ID 1 del inventario

![]()

![]()

### Añadir 7 unidades cantidad a un item que ya existe

![]()

![]()

### Se remueven 3 unidades cantidad a un item que ya existe

![]()

![]()

### Se lee la cantidad actualmente en stock de un item especifico

![]()

![]()

### Se leen todas las cantidades de todos los items

![]()

![]()

### Se remueven cantidades de multiples items, en este caso se remueven 2 unidades del item1 y 3 unidades del item2

![]()

![]()

### Se crea un ShopCart con un ID 5

![]()

![]()

### Se elimina un ShopCart ya existente

![]()

![]()

### Se añaden dos unidades del item2 al ShopCart 5

![]()

![]()

### Se remueve una unidad del item2 del ShopCart 5

![]()

![]()

### Se consultan los contenidos de un ShopCart

![]()

![]()

### Se crea una dirección de envio nueva con AddressId 1

![]()

![]()

### Se elimina una dirección de envio con AddressId 1

![]()

![]()

### Se hace Checkout, enviando los contenidos del Cart5 a la direccion Address1 y en el proceso removiendo del Inventory los contenidos de Cart5

![]()

![]()