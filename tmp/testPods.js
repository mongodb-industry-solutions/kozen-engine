const pulumi = require("@pulumi/pulumi");
const kubernetes = require("@pulumi/kubernetes");
const fs = require("fs");
const { LocalWorkspace } = require("@pulumi/pulumi/automation");

(async () => {
  // Configuración del stack
  const stackName = "dev"; // Nombre del stack
  const projectName = "eks-pod-project"; // Nombre del proyecto
  const kubeconfigPath = `${process.env.HOME}/.kube/config`;
  const kubeconfig = fs.readFileSync(kubeconfigPath).toString();

  // Define el programa de infraestructura como función
  const pulumiProgram = async () => {
    // Define el proveedor de Kubernetes con el kubeconfig
    const k8sProvider = new kubernetes.Provider("eksProvider", { kubeconfig });

    // Crea un namespace para tus recursos
    const namespaceName = "pulumi-namespace";
    const namespace = new kubernetes.core.v1.Namespace(
      namespaceName,
      {
        metadata: { name: namespaceName },
      },
      { provider: k8sProvider }
    );

    // Define un Pod básico
    const podName = "nginx-pod";
    const pod = new kubernetes.core.v1.Pod(
      podName,
      {
        metadata: {
          name: podName,
          namespace: namespace.metadata.name,
        },
        spec: {
          containers: [
            {
              name: "nginx-container",
              image: "nginx:latest", // Imagen del contenedor
              ports: [{ containerPort: 80 }], // Exponer el puerto 80
            },
          ],
        },
      },
      { provider: k8sProvider }
    );

    // Exporta detalles importantes
    return {
      namespaceName: namespace.metadata.name.apply((n) => n),
      podName: pod.metadata.name.apply((n) => n),
    };
  };

  try {
    // Crea o selecciona el stack usando LocalWorkspace
    const stack = await LocalWorkspace.createOrSelectStack({
      stackName,
      projectName,
      program: pulumiProgram, // Programa definido arriba

    }, { envVars: {
                PULUMI_CONFIG_PASSPHRASE: process.env.PULUMI_CONFIG_PASSPHRASE || "K0Z3N-IsSoSecure",
            }
    });

    // Configura el stack si es necesario (ejemplo: define variables de configuración)
    console.log(`Configurando el stack [${stackName}]...`);
    await stack.setConfig("aws:accessKey", {
      value: process.env.AWS_ACCESS_KEY_ID,
    });
    await stack.setConfig("aws:secretKey", {
      value: process.env.AWS_SECRET_ACCESS_KEY,
    });
    await stack.setConfig("aws:region", {
      value: process.env.AWS_REGION || "us-east-1",
    });

    // Ejecuta el despliegue de Pulumi
    console.log("Actualizando el stack...");
    const result = await stack.up();
    console.log("Apuntando al clúster de EKS...");

    // Imprime los outputs del stack
    console.log("Actualización completa. Outputs:");
    console.log(result.outputs);
  } catch (err) {
    console.error("Error durante el despliegue:", err);
    process.exit(1);
  }
})();
