import * as kubernetes from '@pulumi/kubernetes';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export async function pulumiProgram() {
    // Define el proveedor de Kubernetes con el kubeconfig
    const kubeconfigPath = path.join(os.homedir(), '.kube', 'config');
    const kubeconfig = fs.existsSync(kubeconfigPath) ? fs.readFileSync(kubeconfigPath, 'utf8') : '';
    
    if (!kubeconfig) {
        throw new Error(`Kubeconfig not found at ${kubeconfigPath}`);
    }
    
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
    const podName = "nginx-nony-38";
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
