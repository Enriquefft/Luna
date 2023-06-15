import aws_cdk as core
import aws_cdk.assertions as assertions

from luna.luna_stack import LunaStack

# example tests. To run these tests, uncomment this file along with the example
# resource in luna/luna_stack.py
def test_sqs_queue_created():
    app = core.App()
    stack = LunaStack(app, "luna")
    template = assertions.Template.from_stack(stack)

#     template.has_resource_properties("AWS::SQS::Queue", {
#         "VisibilityTimeout": 300
#     })
