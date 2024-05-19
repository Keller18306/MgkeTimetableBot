import VKAppDefaultMethod from "./_default";

export default class VkAppAcceptKeyMethod extends VKAppDefaultMethod {

    public httpMethod: "GET" | "POST" = 'POST';
    public method: string = 'acceptKey';

    handler() {
        return {
            status: 'valid',
            message: 'Данный метод больше недоступен'
        };
    }
}