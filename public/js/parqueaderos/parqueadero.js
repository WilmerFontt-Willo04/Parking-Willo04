class Parqueadero {
  constructor() {
    this.db = firebase.firestore();
  }

  async crearEntrada(
    uid,
    idParqueadero,
    nombreCliente,
    placa,
    celularCliente,
    observacion,
    imagenLink
  ) {
    try {
      const refDoc = await this.db
        .collection("entradas")
        // .doc('id')
        // .set({}).... se puede utilizar en lugar de add
        .add({
          uid: uid,
          idparqueadero: idParqueadero,
          nombrecliente: nombreCliente,
          placa: placa,
          celularcliente: celularCliente,
          observacion: observacion,
          imagenlink: imagenLink,
          fecha: firebase.firestore.FieldValue.serverTimestamp(),
        });
      await this.db.collection("parqueaderos").doc(idParqueadero).update({
        libre: false,
      });

      return refDoc.id;
    } catch (error) {
      console.error(`Error creando la entrada => ${error}`);
    }
  }

  async crearSalida(idEntrada, fechaSalida, costo, idParqueadero) {
    try {
      await this.db
        .collection("entradas")
        .doc(idEntrada)
        .set(
          {
            salida: {
              fechaSalida: fechaSalida,
              costo: costo,
            },
          },
          { merge: true }
        );

      await this.db.collection("parqueaderos").doc(idParqueadero).update({
        libre: true,
      });

      return true;
    } catch (error) {
      console.error(`Error creando la salida => ${error}`);
    }
  }

  async consultarTodosParqueaderos(fntCallBack) {
    try {
      await this.db
        .collection("parqueaderos")
        .orderBy("nombre", "asc")
        .onSnapshot((parqueaderos) => {
          this.consultarEntradasDeParqueaderos(parqueaderos, fntCallBack);
        });
    } catch (error) {
      console.error(`Error consultando todos los parqueaderos => ${error}`);
    }
  }

  async consultarTodosParqueaderosUnaVez(fntCallBack) {
    try {
      const parqueaderos = await this.db
        .collection("parqueaderos")
        .orderBy("nombre", "asc")
        .get();

      this.consultarEntradasDeParqueaderos(parqueaderos, fntCallBack);
    } catch (error) {
      console.error(`Error consultando todos los parqueaderos => ${error}`);
    }
  }

  async consultarEntradasDeParqueaderos(parqueaderos, fntCallBack) {
    $("#parqueaderos").empty();

    parqueaderos.forEach(async (parqueadero) => {
      const parqueaderodata = parqueadero.data();

      const entradasParqueadero = await this.db
        .collection("entradas")
        .where("idparqueadero", "==", parqueadero.id)
        .orderBy("fecha", "desc")
        .limit(1)
        .get();

      if (entradasParqueadero.empty || parqueaderodata.libre === true) {
        fntCallBack({
          nombreParqueadero: parqueaderodata.nombre,
          libre: parqueaderodata.libre,
          id: parqueadero.id,
        });
      } else {
        const entrada = entradasParqueadero.docs[0].data();
        fntCallBack({
          nombreParqueadero: parqueaderodata.nombre,
          libre: parqueaderodata.libre,
          id: parqueadero.id,
          nombreCliente: entrada.nombrecliente,
          celularCliente: entrada.celularcliente,
          placa: entrada.placa,
          observacion: entrada.observacion,
          imagenLink: entrada.imagenlink,
          fecha: entrada.fecha,
          idEntrada: entradasParqueadero.docs[0].id,
        });
      }
    });
  }

  async consultarParqueaderoLibres(fntCallBack) {
    try {
      const parqueaderos = await this.db
        .collection("parqueaderos")
        .where("libre", "==", true)
        .orderBy("nombre", "asc")
        .get();

      const list = [];

      parqueaderos.forEach((parqueadero) => {
        const parqueaderodata = parqueadero.data();
        list.push({
          nombreParqueadero: parqueaderodata.nombre,
          libre: parqueaderodata.libre,
          id: parqueadero.id,
        });
      });

      return list;
    } catch (error) {
      console.error(
        `Error consultando todos los parqueaderos libres => ${error}`
      );
    }
  }

  subirImagenPost(file, uid) {
    const refStorage = firebase
      .storage()
      .ref(`imgsParqueaderos/${uid}/${file.name}`);

    const task = refStorage.put(file);

    task.on(
      "state_changed",
      (snapshot) => {
        const porcentaje =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        $(".determinate").attr("style", `width: ${porcentaje}%`);
      },
      (err) => {
        Materialize.toast(`Error subiendo el archivo => ${err.message}`, 4000);
      },
      async () => {
        try {
          const url = await task.snapshot.ref.getDownloadURL();
          sessionStorage.setItem("imgNewEntrada", url);
        } catch (error) {
          console.error(error);
          Materialize.toast(
            `Error obteniendo la Url de descarga => ${error.message}`,
            4000
          );
        }
      }
    );
  }
}
