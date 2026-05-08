class DWPoseWrapper:
    def extract_pose(self, image):
        return {
            "keypoints": {
                "body": []
            },
            "score": 1.0
        }
